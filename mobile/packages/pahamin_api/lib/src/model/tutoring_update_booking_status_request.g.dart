// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tutoring_update_booking_status_request.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

TutoringUpdateBookingStatusRequest _$TutoringUpdateBookingStatusRequestFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('TutoringUpdateBookingStatusRequest', json, (
  $checkedConvert,
) {
  final val = TutoringUpdateBookingStatusRequest(
    status: $checkedConvert('status', (v) => v as String?),
  );
  return val;
});

Map<String, dynamic> _$TutoringUpdateBookingStatusRequestToJson(
  TutoringUpdateBookingStatusRequest instance,
) => <String, dynamic>{'status': ?instance.status};
