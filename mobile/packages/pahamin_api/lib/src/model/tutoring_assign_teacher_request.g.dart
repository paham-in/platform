// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tutoring_assign_teacher_request.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

TutoringAssignTeacherRequest _$TutoringAssignTeacherRequestFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('TutoringAssignTeacherRequest', json, ($checkedConvert) {
  final val = TutoringAssignTeacherRequest(
    teacherId: $checkedConvert('teacher_id', (v) => (v as num?)?.toInt()),
  );
  return val;
}, fieldKeyMap: const {'teacherId': 'teacher_id'});

Map<String, dynamic> _$TutoringAssignTeacherRequestToJson(
  TutoringAssignTeacherRequest instance,
) => <String, dynamic>{'teacher_id': ?instance.teacherId};
