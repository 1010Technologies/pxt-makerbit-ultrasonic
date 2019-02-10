/**
 * Ultrasonic tests
 */

makerbit.connectUltrasonic(DigitalPin.P5, DigitalPin.P8);

const distance: number = makerbit.getUltrasonicDistance(DistanceUnit.CM);

const isNear = makerbit.isUltrasonicDistanceLessThan(10, DistanceUnit.CM);
