// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'subject_admin_update_subject_request.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

SubjectAdminUpdateSubjectRequest _$SubjectAdminUpdateSubjectRequestFromJson(
  Map<String, dynamic> json,
) =>
    $checkedCreate('SubjectAdminUpdateSubjectRequest', json, ($checkedConvert) {
      final val = SubjectAdminUpdateSubjectRequest(
        classIds: $checkedConvert(
          'class_ids',
          (v) => (v as List<dynamic>?)?.map((e) => (e as num).toInt()).toList(),
        ),
        name: $checkedConvert('name', (v) => v as String?),
        programId: $checkedConvert('program_id', (v) => (v as num?)?.toInt()),
      );
      return val;
    }, fieldKeyMap: const {'classIds': 'class_ids', 'programId': 'program_id'});

Map<String, dynamic> _$SubjectAdminUpdateSubjectRequestToJson(
  SubjectAdminUpdateSubjectRequest instance,
) => <String, dynamic>{
  'class_ids': ?instance.classIds,
  'name': ?instance.name,
  'program_id': ?instance.programId,
};
