// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tutoring_update_session_request.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

TutoringUpdateSessionRequest _$TutoringUpdateSessionRequestFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('TutoringUpdateSessionRequest', json, ($checkedConvert) {
  final val = TutoringUpdateSessionRequest(
    date: $checkedConvert('date', (v) => v as String?),
    endTime: $checkedConvert('end_time', (v) => v as String?),
    startTime: $checkedConvert('start_time', (v) => v as String?),
  );
  return val;
}, fieldKeyMap: const {'endTime': 'end_time', 'startTime': 'start_time'});

Map<String, dynamic> _$TutoringUpdateSessionRequestToJson(
  TutoringUpdateSessionRequest instance,
) => <String, dynamic>{
  'date': ?instance.date,
  'end_time': ?instance.endTime,
  'start_time': ?instance.startTime,
};
