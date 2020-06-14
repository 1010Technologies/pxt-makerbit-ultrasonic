/**
 * Ultrasonic tests
 */

makerbit.connectUltrasonicDistanceSensor(DigitalPin.P5, DigitalPin.P8);
makerbit.onUltrasonicObjectDetected(10, DistanceUnit.CM, () => {});
const distance: number = makerbit.getUltrasonicDistance(DistanceUnit.CM);
const isNear = makerbit.isUltrasonicDistanceLessThan(10, DistanceUnit.CM);
