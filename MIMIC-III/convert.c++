// convert.c++ : MIMIC-III binary-to-cvs converter
//
// Copyright (c) 2025 Viktor T. Toth
// 
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

#include <iostream>
#include <fstream>
#include <sstream>
#include <vector>
#include <string>
#include <cstdint>
#include <iomanip>
#include <algorithm>
#include <cmath>    // For std::isnan
#include <limits>   // For std::numeric_limits
#include <set>      // For std::set

struct SignalInfo
{
  std::string signalName;
  double gain;            // ADC gain
  int baselineAdc;        // Baseline ADC value
  std::string units;      // Physical units (e.g., bpm, mmHg)
  int format;             // Storage format (e.g., 16)
  int adcResolution;      // ADC resolution (bits)
  int adcZero;            // ADC zero value
  int initialValue;       // Initial sample value
  int checksum;           // Checksum for the signal
  int blockSize;          // Block size (usually 0)
};

struct RecordInfo
{
  std::string recordName;
  int numSignals;
  int numSamples;
  double secondsPerSample; // Sampling interval in seconds
  std::vector<SignalInfo> signals;
};

RecordInfo parseHeader(const std::string& headerFileName)
{
  RecordInfo record;
  std::ifstream headerFile(headerFileName);
  if (!headerFile.is_open())
  {
    std::cerr << "Error opening header file: " << headerFileName << std::endl;
    exit(1);
  }

  std::string line;
  int lineNum = 0;
  while (std::getline(headerFile, line))
  {
    std::istringstream iss(line);
    if (lineNum == 0)
    {
      // First line: Record information
      iss >> record.recordName >> record.numSignals;
      std::string samplingInfo;
      iss >> samplingInfo;
      size_t slashPos = samplingInfo.find('/');
      if (slashPos != std::string::npos)
      {
        // Extract seconds per sample before the slash
        record.secondsPerSample = std::stod(samplingInfo.substr(0, slashPos));
      }
      else
      {
        record.secondsPerSample = std::stod(samplingInfo);
      }
      record.secondsPerSample = 1 / record.secondsPerSample; // VTT
      iss >> record.numSamples;
      // Ignore base time (startTime)
    }
    else
    {
      // Signal lines
      std::string filename;
      int format;
      std::string gainUnits;
      int adcResolution;
      int adcZero;
      int initialValue;
      int checksum;
      int blockSize;
      std::string signalName;

      iss >> filename >> format >> gainUnits >> adcResolution >> adcZero >> initialValue >> checksum >> blockSize;

      // Read the rest of the line into signalName
      std::getline(iss, signalName);

      // Trim leading and trailing whitespace, including carriage returns
      signalName.erase(0, signalName.find_first_not_of(" \t\r\n"));
      signalName.erase(signalName.find_last_not_of(" \t\r\n") + 1);

      if (filename == "#") continue;

      // Parse gain, baseline ADC, and units
      double gain;
      int baselineAdc = 0;
      std::string units;
      size_t slashPos = gainUnits.find('/');
      size_t openParenPos = gainUnits.find('(');
      size_t closeParenPos = gainUnits.find(')');

      if (openParenPos != std::string::npos && closeParenPos != std::string::npos)
      {
        // Extract gain and baseline ADC
        gain = std::stod(gainUnits.substr(0, openParenPos));
        baselineAdc = std::stoi(gainUnits.substr(openParenPos + 1, closeParenPos - openParenPos - 1));
        units = gainUnits.substr(closeParenPos + 1);
      }
      else if (slashPos != std::string::npos)
      {
        gain = std::stod(gainUnits.substr(0, slashPos));
        units = gainUnits.substr(slashPos + 1);
      }
      else
      {
        gain = std::stod(gainUnits);
        units = ""; // Units not specified
      }

      SignalInfo signal;
      signal.signalName = signalName;
      signal.gain = gain;
      signal.baselineAdc = baselineAdc;
      signal.units = units;
      signal.format = format;
      signal.adcResolution = adcResolution;
      signal.adcZero = adcZero;
      signal.initialValue = initialValue;
      signal.checksum = checksum;
      signal.blockSize = blockSize;

      record.signals.push_back(signal);
    }
    ++lineNum;
  }

  headerFile.close();
  return record;
}

std::vector<std::vector<int16_t>> readData(const std::string& dataFileName, int numSignals, int numSamples)
{
  std::ifstream dataFile(dataFileName, std::ios::binary);
  if (!dataFile.is_open())
  {
    std::cerr << "Error opening data file: " << dataFileName << std::endl;
    exit(1);
  }

  size_t totalSamples = static_cast<size_t>(numSignals) * numSamples;
  std::vector<int16_t> rawData(totalSamples);

  // Read the entire data file
  dataFile.read(reinterpret_cast<char*>(rawData.data()), totalSamples * sizeof(int16_t));
  if (!dataFile)
  {
    std::cerr << "Error reading data file: " << dataFileName << std::endl;
    exit(1);
  }
  dataFile.close();

  // Swap bytes for endianness correction
  // If data appears correct without swapping, comment out the following lines
  // for (size_t i = 0; i < rawData.size(); ++i)
  // {
  //     rawData[i] = swapEndian(rawData[i]);
  // }

  // Demultiplex the data
  std::vector<std::vector<int16_t>> signalData(numSignals, std::vector<int16_t>(numSamples));
  for (int i = 0; i < numSamples; ++i)
  {
    for (int j = 0; j < numSignals; ++j)
    {
      signalData[j][i] = rawData[i * numSignals + j];
    }
  }

  return signalData;
}

std::vector<std::vector<double>> scaleData(const std::vector<std::vector<int16_t>>& signalData, const RecordInfo& record)
{
  int numSignals = record.numSignals;
  int numSamples = record.numSamples;
  std::vector<std::vector<double>> scaledData(numSignals, std::vector<double>(numSamples));

  for (int i = 0; i < numSignals; ++i)
  {
    double gain = record.signals[i].gain;
    int adcZero = record.signals[i].adcZero;
    int baselineAdc = record.signals[i].baselineAdc;
    const std::string& signalName = record.signals[i].signalName;

    // Determine if we should treat zero as missing for this signal
    bool zeroIsMissing = false;
    // List of signals where zero represents missing data
    const std::set<std::string> zeroMissingSignals = {"HR", "ABPSys", "ABPDias", "ABPMean", "PULSE", "RESP", "SpO2"};
    if (zeroMissingSignals.find(signalName) != zeroMissingSignals.end())
    {
      zeroIsMissing = true;
    }

    for (int j = 0; j < numSamples; ++j)
    {
      int rawValue = signalData[i][j];
      if (rawValue == -32768 || (zeroIsMissing && rawValue == 0))
      {
        // Missing value
        scaledData[i][j] = std::numeric_limits<double>::quiet_NaN();
      }
      else
      {
        // Apply the scaling formula: (raw - ADCzero - baseline) / gain
        scaledData[i][j] = static_cast<double>(rawValue - adcZero - baselineAdc) / gain;
      }
    }
  }

  return scaledData;
}

std::vector<double> generateTimestamps(int numSamples, double secondsPerSample)
{
  std::vector<double> timestamps(numSamples);
  for (int i = 0; i < numSamples; ++i)
  {
    timestamps[i] = i * secondsPerSample;
  }
  return timestamps;
}

void writeCSV(const std::string& outputFileName, const std::vector<double>& timestamps,
  const std::vector<std::vector<double>>& scaledData, const RecordInfo& record)
{
  std::ofstream outFile(outputFileName);
  if (!outFile.is_open())
  {
    std::cerr << "Error opening output file: " << outputFileName << std::endl;
    exit(1);
  }

  int numSignals = record.numSignals;
  int numSamples = scaledData[0].size();

  // Set precision for output
  outFile << std::fixed << std::setprecision(6);

  // Write header
  outFile << "Time";
  for (const auto& signal : record.signals)
  {
    outFile << "," << signal.signalName;
  }
  outFile << "\n";

  // Write data
  for (int i = 0; i < numSamples; ++i)
  {
    outFile << 1000.0 * timestamps[i];
    for (int j = 0; j < numSignals; ++j)
    {
      outFile << ",";
      if (std::isnan(scaledData[j][i]))
      {
        // Missing value, leave field empty
      }
      else
      {
        outFile << scaledData[j][i];
      }
    }
    outFile << "\n";
  }

  outFile.close();
}

int main(int argc, char *argv[])
{
  if (argc < 2)
  {
    std::cerr << "Usage: ./convert_mimic_waveform <recordName> [outputFileName]" << std::endl;
    return 1;
  }

  std::string recordName = argv[1];
  std::string headerFileName = recordName + ".hea";
  std::string dataFileName = recordName + ".dat";
  std::string outputFileName = "output.csv";

  if (argc >= 3)
  {
    outputFileName = argv[2];
  }

  // Parse header file
  RecordInfo record = parseHeader(headerFileName);

  // Read binary data file
  std::vector<std::vector<int16_t>> signalData = readData(dataFileName, record.numSignals, record.numSamples);

  // Scale the data
  std::vector<std::vector<double>> scaledData = scaleData(signalData, record);

  // Generate timestamps
  std::vector<double> timestamps = generateTimestamps(record.numSamples, record.secondsPerSample);

  // Write to CSV
  writeCSV(outputFileName, timestamps, scaledData, record);

  std::cout << "Data has been successfully converted to " << outputFileName << std::endl;
  return 0;
}
