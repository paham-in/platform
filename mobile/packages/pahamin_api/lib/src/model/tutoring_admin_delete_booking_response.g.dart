// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tutoring_admin_delete_booking_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

TutoringAdminDeleteBookingResponse _$TutoringAdminDeleteBookingResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('TutoringAdminDeleteBookingResponse', json, (
  $checkedConvert,
) {
  final val = TutoringAdminDeleteBookingResponse(
    message: $checkedConvert('message', (v) => v as String?),
  );
  return val;
});

Map<String, dynamic> _$TutoringAdminDeleteBookingResponseToJson(
  TutoringAdminDeleteBookingResponse instance,
) => <String, dynamic>{'message': ?instance.message};
