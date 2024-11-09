#!/bin/python3

import math

def valSine(t, f, p, mf, ma):
    return 0.0 + 1.0 * math.cos(f * t + p) * (1.0 + ma * math.cos(mf * t))

def valTriangle(t, f, p, mf, ma):
    v = ((mf * t) / (2.0 * math.pi)) % 1.0
    return 0.0 + 1.0 * math.cos(f * t + p) * (1.0 + ma * v)

def valSquare(t, f, p, mf, ma):
    v = math.cos(mf * t)
    v = (v > 0) - (v < 0)
    return 0.0 + 1.0 * math.cos(f * t + p) * (1.0 + ma * v)

def main():
    print("\"time\",\"carrier\",\"modulation\"")
    for i in range(0, 100):
        time = 86400.0 * i
        carrier = valSine(10.0 * i, 0.1, 0.0, 0.017, 0.9)
        modulation = valSine(10.0 * i, 0.0, 0.0, 0.017, 0.9)
        print(f"{time:.6f},{carrier:.6f},{modulation:.6f}")
    for i in range(100, 400):
        time = 86400.0 * i
        carrier = valTriangle(10.0 * i, 0.12, 0.0, 0.01, 0.7)
        modulation = valTriangle(10.0 * i, 0.0, 0.0, 0.01, 0.7)
        print(f"{time:.6f},{carrier:.6f},{modulation:.6f}")
    for i in range(400, 700):
        time = 86400.0 * i
        carrier = valSine(10.0 * i, 0.12, 0.0, 0.008, 0.6)
        modulation = valSine(10.0 * i, 0.0, 0.0, 0.008, 0.6)
        print(f"{time:.6f},{carrier:.6f},{modulation:.6f}")
    for i in range(700, 1000):
        time = 86400.0 * i
        carrier = valSquare(10.0 * i, 0.12, 0.0, 0.007, 0.5)
        modulation = valSquare(10.0 * i, 0.0, 0.0, 0.007, 0.5)
        print(f"{time:.6f},{carrier:.6f},{modulation:.6f}")

if __name__ == "__main__":
    main()
