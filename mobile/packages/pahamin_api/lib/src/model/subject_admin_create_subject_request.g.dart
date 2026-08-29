// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'subject_admin_create_subject_request.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

SubjectAdminCreateSubjectRequest _$SubjectAdminCreateSubjectRequestFromJson(
  Map<String, dynamic> json,
) =>
    $checkedCreate('SubjectAdminCreateSubjectRequest', json, ($checkedConvert) {
      final val = SubjectAdminCreateSubjectRequest(
        classIds: $checkedConvert(
          'class_ids',
          (v) => (v as List<dynamic>?)?.map((e) => (e as num).toInt()).toList(),
        ),
        name: $checkedConvert('name', (v) => v as String?),
        programId: $checkedConvert('program_id', (v) => (v as num?)?.toInt()),
      );
      return val;
    }, fieldKeyMap: const {'classIds': 'class_ids', 'programId': 'program_id'});

Map<String, dynamic> _$SubjectAdminCreateSubjectRequestToJson(
  SubjectAdminCreateSubjectRequest instance,
) => <String, dynamic>{
  'class_ids': ?instance.classIds,
  'name': ?instance.name,
  'program_id': ?instance.programId,
};
