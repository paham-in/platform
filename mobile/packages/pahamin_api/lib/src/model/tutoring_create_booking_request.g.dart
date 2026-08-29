// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tutoring_create_booking_request.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

TutoringCreateBookingRequest _$TutoringCreateBookingRequestFromJson(
  Map<String, dynamic> json,
) => $checkedCreate(
  'TutoringCreateBookingRequest',
  json,
  ($checkedConvert) {
    final val = TutoringCreateBookingRequest(
      classId: $checkedConvert('class_id', (v) => (v as num?)?.toInt()),
      date: $checkedConvert('date', (v) => v as String?),
      endTime: $checkedConvert('end_time', (v) => v as String?),
      memberEmails: $checkedConvert(
        'member_emails',
        (v) => (v as List<dynamic>?)?.map((e) => e as String).toList(),
      ),
      mode: $checkedConvert('mode', (v) => v as String?),
      note: $checkedConvert('note', (v) => v as String?),
      sessionCount: $checkedConvert(
        'session_count',
        (v) => (v as num?)?.toInt(),
      ),
      startTime: $checkedConvert('start_time', (v) => v as String?),
      subjectId: $checkedConvert('subject_id', (v) => (v as num?)?.toInt()),
      teacherId: $checkedConvert('teacher_id', (v) => (v as num?)?.toInt()),
    );
    return val;
  },
  fieldKeyMap: const {
    'classId': 'class_id',
    'endTime': 'end_time',
    'memberEmails': 'member_emails',
    'sessionCount': 'session_count',
    'startTime': 'start_time',
    'subjectId': 'subject_id',
    'teacherId': 'teacher_id',
  },
);

Map<String, dynamic> _$TutoringCreateBookingRequestToJson(
  TutoringCreateBookingRequest instance,
) => <String, dynamic>{
  'class_id': ?instance.classId,
  'date': ?instance.date,
  'end_time': ?instance.endTime,
  'member_emails': ?instance.memberEmails,
  'mode': ?instance.mode,
  'note': ?instance.note,
  'session_count': ?instance.sessionCount,
  'start_time': ?instance.startTime,
  'subject_id': ?instance.subjectId,
  'teacher_id': ?instance.teacherId,
};
