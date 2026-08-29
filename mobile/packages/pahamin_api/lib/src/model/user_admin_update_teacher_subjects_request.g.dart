// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_admin_update_teacher_subjects_request.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

UserAdminUpdateTeacherSubjectsRequest
_$UserAdminUpdateTeacherSubjectsRequestFromJson(Map<String, dynamic> json) =>
    $checkedCreate('UserAdminUpdateTeacherSubjectsRequest', json, (
      $checkedConvert,
    ) {
      final val = UserAdminUpdateTeacherSubjectsRequest(
        subjectIds: $checkedConvert(
          'subject_ids',
          (v) => (v as List<dynamic>?)?.map((e) => (e as num).toInt()).toList(),
        ),
      );
      return val;
    }, fieldKeyMap: const {'subjectIds': 'subject_ids'});

Map<String, dynamic> _$UserAdminUpdateTeacherSubjectsRequestToJson(
  UserAdminUpdateTeacherSubjectsRequest instance,
) => <String, dynamic>{'subject_ids': ?instance.subjectIds};
