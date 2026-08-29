// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'subject_admin_delete_subject_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

SubjectAdminDeleteSubjectResponse _$SubjectAdminDeleteSubjectResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('SubjectAdminDeleteSubjectResponse', json, (
  $checkedConvert,
) {
  final val = SubjectAdminDeleteSubjectResponse(
    message: $checkedConvert('message', (v) => v as String?),
  );
  return val;
});

Map<String, dynamic> _$SubjectAdminDeleteSubjectResponseToJson(
  SubjectAdminDeleteSubjectResponse instance,
) => <String, dynamic>{'message': ?instance.message};
