// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'subject_admin_create_subject_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

SubjectAdminCreateSubjectResponse _$SubjectAdminCreateSubjectResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate(
  'SubjectAdminCreateSubjectResponse',
  json,
  ($checkedConvert) {
    final val = SubjectAdminCreateSubjectResponse(
      classIds: $checkedConvert(
        'class_ids',
        (v) => (v as List<dynamic>?)?.map((e) => (e as num).toInt()).toList(),
      ),
      id: $checkedConvert('id', (v) => (v as num?)?.toInt()),
      materialCount: $checkedConvert(
        'material_count',
        (v) => (v as num?)?.toInt(),
      ),
      name: $checkedConvert('name', (v) => v as String?),
      programId: $checkedConvert('program_id', (v) => (v as num?)?.toInt()),
      slug: $checkedConvert('slug', (v) => v as String?),
    );
    return val;
  },
  fieldKeyMap: const {
    'classIds': 'class_ids',
    'materialCount': 'material_count',
    'programId': 'program_id',
  },
);

Map<String, dynamic> _$SubjectAdminCreateSubjectResponseToJson(
  SubjectAdminCreateSubjectResponse instance,
) => <String, dynamic>{
  'class_ids': ?instance.classIds,
  'id': ?instance.id,
  'material_count': ?instance.materialCount,
  'name': ?instance.name,
  'program_id': ?instance.programId,
  'slug': ?instance.slug,
};
