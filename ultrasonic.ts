// MakerBit blocks supporting a HC-SR04 ultrasonic distance sensor

const enum DistanceUnit {
  //% block="cm"
  CM = 58, // Duration of echo round-trip in Microseconds (uS) for two centimeters, 343 m/s at sea level and 20°C
  //% block="inch"
  INCH = 148 // Duration of echo round-trip in Microseconds (uS) for two inches, 343 m/s at sea level and 20°C
}

namespace makerbit {
  const MAX_ULTRASONIC_TRAVEL_TIME = 300 * DistanceUnit.CM;

  interface UltrasonicRoundTrip {
    ts: number;
    rtt: number;
  }

  interface UltrasonicDevice {
    trig: DigitalPin;
    roundTrips: UltrasonicRoundTrip[];
    medianRoundTrip: number;
  }

  let ultrasonicDevice: UltrasonicDevice;

  /**
   * Configures the ultrasonic sensor and measures continuously in the background.
   * @param trig pin connected to trig, eg: DigitalPin.P5
   * @param echo pin connected to echo, eg: DigitalPin.P8
   */
  //% subcategory="Ultrasonic"
  //% blockId="makerbit_ultrasonic_connect"
  //% block="connect ultrasonic sensor | with Trig at %trig | and Echo at %echo"
  //% trig.fieldEditor="gridpicker"
  //% trig.fieldOptions.columns=4
  //% trig.fieldOptions.tooltips="false"
  //% echo.fieldEditor="gridpicker"
  //% echo.fieldOptions.columns=4
  //% echo.fieldOptions.tooltips="false"
  //% weight=80
  export function connectUltrasonic(trig: DigitalPin, echo: DigitalPin): void {
    if (ultrasonicDevice) {
      return;
    }

    ultrasonicDevice = {
      trig: trig,
      roundTrips: [{ ts: 0, rtt: MAX_ULTRASONIC_TRAVEL_TIME }],
      medianRoundTrip: MAX_ULTRASONIC_TRAVEL_TIME
    };

    pins.onPulsed(echo, PulseValue.High, () => {
      if (pins.pulseDuration() < MAX_ULTRASONIC_TRAVEL_TIME) {
        ultrasonicDevice.roundTrips.push({
          ts: input.runningTime(),
          rtt: pins.pulseDuration()
        });
      }
    });

    control.inBackground(measureInBackground);
  }

  /**
   * Returns the distance to an object in a range from 1 to 300 centimeters or up to 118 inch.
   * The maximum value is returned to indicate when no object was detected.
   * -1 is returned when the device is not connected.
   * @param unit unit of distance, eg: DistanceUnit.CM
   */
  //% subcategory="Ultrasonic"
  //% blockId="makerbit_ultrasonic_distance"
  //% block="ultrasonic distance in %unit"
  //% weight=60
  export function getUltrasonicDistance(unit: DistanceUnit): number {
    if (!ultrasonicDevice) {
      return -1;
    }
    return Math.idiv(ultrasonicDevice.medianRoundTrip, unit);
  }

  /**
   * Returns `true` if an object is within the specified distance. `false` otherwise.
   *
   * @param distance distance to object, eg: 10
   * @param unit unit of distance, eg: DistanceUnit.CM
   */
  //% subcategory="Ultrasonic"
  //% blockId="makerbit_ultrasonic_less_than"
  //% block="ultrasonic distance is less than |%distance|%unit"
  //% weight=50
  export function isUltrasonicDistanceLessThan(
    distance: number,
    unit: DistanceUnit
  ): boolean {
    if (!ultrasonicDevice) {
      return false;
    }
    return Math.idiv(ultrasonicDevice.medianRoundTrip, unit) < distance;
  }

  function triggerPulse() {
    // Reset trigger pin
    pins.setPull(ultrasonicDevice.trig, PinPullMode.PullNone);
    pins.digitalWritePin(ultrasonicDevice.trig, 0);
    control.waitMicros(2);

    // Trigger pulse
    pins.digitalWritePin(ultrasonicDevice.trig, 1);
    control.waitMicros(10);
    pins.digitalWritePin(ultrasonicDevice.trig, 0);
  }

  function getMedianRRT(roundTrips: UltrasonicRoundTrip[]) {
    const roundTripTimes = roundTrips.map(urt => urt.rtt);
    return median(roundTripTimes);
  }

  // Returns median value of non-empty input
  function median(values: number[]) {
    values.sort((a, b) => {
      return a - b;
    });
    return values[(values.length - 1) >> 1];
  }

  function measureInBackground() {
    const trips = ultrasonicDevice.roundTrips;
    const TIME_BETWEEN_PULSE_MS = 145;

    while (true) {
      const now = input.runningTime();

      if (trips[trips.length - 1].ts < now - TIME_BETWEEN_PULSE_MS - 10) {
        ultrasonicDevice.roundTrips.push({
          ts: now,
          rtt: MAX_ULTRASONIC_TRAVEL_TIME
        });
      }

      if (trips.length > 3) {
        trips.shift();
      }

      ultrasonicDevice.medianRoundTrip = getMedianRRT(
        ultrasonicDevice.roundTrips
      );

      triggerPulse();
      basic.pause(TIME_BETWEEN_PULSE_MS);
    }
  }
}
