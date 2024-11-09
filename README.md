#GRU network to analyze MIMIC high-cadence data

The purpose of this Web application is to analyze high-cadence numerical data that is offered as part of version IV of the Medical Information Mart for Intensive Care (MIMIC) database, using a gated recurrent unit (GRU) neural network.

As part of the [MIMIC-IV v2.0 release](https://physionet.org/content/mimiciv/2.0/), a set of [waveform data files](https://physionet.org/content/mimic4wdb/0.1.0/) were also released documenting emergency room stays by approximately 200 patients. In addition to the raw waveform data sets, numerical versions were also offered. These comma-delimited (csv) files contained time series data sets of all patient parameters that were monitored during a patient's stay. The present software is designed to analyze these data sets, with the express purpose of discovering cross-correlations between columns, which, once encoded in the form of a GRU network that was trained during the initial segment of a patient's stay, may be useful to predict a selected column from values within other columns. (This would allow predicting the values of an intrusive measurement, for instance, from non-intrusive measurement results.)

The software is written using HTML + JavaScript for a browser-based front-end, with a simple PHP back-end to select and process data files. Running the software requires setting up a Web server that can process PHP code. Most Linux distributions include the Apache Web server with PHP, which can be used for this purpose.

## Setting up

The software can process data files in three steps.

1. Patient selection: When the page is loaded, the PHP back-end enumerates all CSV files in the `DATA` folder of the installation. The file names are utilized to populate the "Select a patient" dropdown box in the first section of the software's user interface. Once a patient is selected, the "Available data" section is populated from the header line of the corresponding CSV file. To proceed, two or more columns must be selected, one of which will later be designated as the value to be predicted, based on the remaining selections. The "Get Data" button can then be used to load the data set, which is displayed in a plot area on the right-hand side.

2. Smoothed resampling

The CSV files in the MIMIC waveform database contain data sampled at uneven intervals. A Gaussian sampling algorithm is used to convert the files into a form with uniform timestamps. The sample step size, standard deviation (used for Gaussian sampling) and the start/end time of the sampling interval may be specified before selecting the "Resample" button to effect the resampling. When resampling is complete, the result is shown in a plot area to the right.

3. Modeling with a neural network

With resampled data at hand, modeling may begin. The dependent column as well as model hyperparameters can be selected in the "Modeling" section of the user interface. Hyperparameters include parameters that control the dimensions of the neural network, the training process, as well as the RNG seed, to ensure strict reproducibility.

The software can utilize two distinct libraries to carry out the actual modeling. By default, a custom GRU library is used but as an alternative, the software can also utilize the popular, standard TensorFlow.js library. To use TensorFlow, the user must select the "User TeonsorFlow.js" checkbox, before selecting the "Run Model" button.

## Running the model

While the model runs, the message area at the bottom of the user interface is used to communicate its progress to the user. In case the custom GRU library is used, the plot to the right of the "Modeling" area of the user interface is regularly updated. (Such visual updates are not available when TensorFlow is selected.) This allows for the monitoring of the model's progress and, if necessary, interrupt its run. When the model finishes running, a final tally is displayed including a calculated chi-square per degree of freedom value as a measure of the goodness of the fit.

## Data sources

The software expects CSV files in the `DATA` subdirectory. This subdirectory is not populated, as access to the MIMIC data, though free, is conditional on the user obtaining the requisite credentials. There is one test file provided, `testdata.csv`, which contains a simple amplitude-modulated signal along with the modulating signal; the functioning of the GRU network can be tested and demonstrated by training the network to demodulate the modulated signal.

## Saving and loading projects

The current state of the user interface, including all loaded and processed data, can be saved locally using the "Save" button in the upper right. All data are saved in the JSON format on the local computer, and can be reloaded using the "Load" button.