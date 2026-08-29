// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'studentclass_student_class_enrollment_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

StudentclassStudentClassEnrollmentResponse
_$StudentclassStudentClassEnrollmentResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate(
  'StudentclassStudentClassEnrollmentResponse',
  json,
  ($checkedConvert) {
    final val = StudentclassStudentClassEnrollmentResponse(
      class_: $checkedConvert(
        'class',
        (v) => v == null
            ? null
            : StudentclassClassRef.fromJson(v as Map<String, dynamic>),
      ),
      classId: $checkedConvert('class_id', (v) => (v as num?)?.toInt()),
      createdAt: $checkedConvert('created_at', (v) => v as String?),
      expiry: $checkedConvert('expiry', (v) => v as String?),
      id: $checkedConvert('id', (v) => (v as num?)?.toInt()),
      user: $checkedConvert(
        'user',
        (v) => v == null
            ? null
            : StudentclassUserRef.fromJson(v as Map<String, dynamic>),
      ),
      userId: $checkedConvert('user_id', (v) => (v as num?)?.toInt()),
    );
    return val;
  },
  fieldKeyMap: const {
    'class_': 'class',
    'classId': 'class_id',
    'createdAt': 'created_at',
    'userId': 'user_id',
  },
);

Map<String, dynamic> _$StudentclassStudentClassEnrollmentResponseToJson(
  StudentclassStudentClassEnrollmentResponse instance,
) => <String, dynamic>{
  'class': ?instance.class_?.toJson(),
  'class_id': ?instance.classId,
  'created_at': ?instance.createdAt,
  'expiry': ?instance.expiry,
  'id': ?instance.id,
  'user': ?instance.user?.toJson(),
  'user_id': ?instance.userId,
};
