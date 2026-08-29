// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tutoring_create_booking_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

TutoringCreateBookingResponse _$TutoringCreateBookingResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate(
  'TutoringCreateBookingResponse',
  json,
  ($checkedConvert) {
    final val = TutoringCreateBookingResponse(
      classId: $checkedConvert('class_id', (v) => (v as num?)?.toInt()),
      createdAt: $checkedConvert('created_at', (v) => v as String?),
      date: $checkedConvert('date', (v) => v as String?),
      endTime: $checkedConvert('end_time', (v) => v as String?),
      groupToken: $checkedConvert('group_token', (v) => v as String?),
      id: $checkedConvert('id', (v) => (v as num?)?.toInt()),
      invoiceStatus: $checkedConvert('invoice_status', (v) => v as String?),
      mode: $checkedConvert('mode', (v) => v as String?),
      note: $checkedConvert('note', (v) => v as String?),
      sessionCount: $checkedConvert(
        'session_count',
        (v) => (v as num?)?.toInt(),
      ),
      startTime: $checkedConvert('start_time', (v) => v as String?),
      status: $checkedConvert('status', (v) => v as String?),
      studentId: $checkedConvert('student_id', (v) => (v as num?)?.toInt()),
      studentName: $checkedConvert('student_name', (v) => v as String?),
      subjectId: $checkedConvert('subject_id', (v) => (v as num?)?.toInt()),
      subjectName: $checkedConvert('subject_name', (v) => v as String?),
      teacherId: $checkedConvert('teacher_id', (v) => (v as num?)?.toInt()),
      teacherName: $checkedConvert('teacher_name', (v) => v as String?),
    );
    return val;
  },
  fieldKeyMap: const {
    'classId': 'class_id',
    'createdAt': 'created_at',
    'endTime': 'end_time',
    'groupToken': 'group_token',
    'invoiceStatus': 'invoice_status',
    'sessionCount': 'session_count',
    'startTime': 'start_time',
    'studentId': 'student_id',
    'studentName': 'student_name',
    'subjectId': 'subject_id',
    'subjectName': 'subject_name',
    'teacherId': 'teacher_id',
    'teacherName': 'teacher_name',
  },
);

Map<String, dynamic> _$TutoringCreateBookingResponseToJson(
  TutoringCreateBookingResponse instance,
) => <String, dynamic>{
  'class_id': ?instance.classId,
  'created_at': ?instance.createdAt,
  'date': ?instance.date,
  'end_time': ?instance.endTime,
  'group_token': ?instance.groupToken,
  'id': ?instance.id,
  'invoice_status': ?instance.invoiceStatus,
  'mode': ?instance.mode,
  'note': ?instance.note,
  'session_count': ?instance.sessionCount,
  'start_time': ?instance.startTime,
  'status': ?instance.status,
  'student_id': ?instance.studentId,
  'student_name': ?instance.studentName,
  'subject_id': ?instance.subjectId,
  'subject_name': ?instance.subjectName,
  'teacher_id': ?instance.teacherId,
  'teacher_name': ?instance.teacherName,
};
