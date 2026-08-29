// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'program_program_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ProgramProgramResponse _$ProgramProgramResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('ProgramProgramResponse', json, ($checkedConvert) {
  final val = ProgramProgramResponse(
    classes: $checkedConvert(
      'classes',
      (v) => (v as List<dynamic>?)
          ?.map((e) => ProgramClassInfo.fromJson(e as Map<String, dynamic>))
          .toList(),
    ),
    createdAt: $checkedConvert('created_at', (v) => v as String?),
    description: $checkedConvert('description', (v) => v as String?),
    id: $checkedConvert('id', (v) => (v as num?)?.toInt()),
    name: $checkedConvert('name', (v) => v as String?),
    slug: $checkedConvert('slug', (v) => v as String?),
  );
  return val;
}, fieldKeyMap: const {'createdAt': 'created_at'});

Map<String, dynamic> _$ProgramProgramResponseToJson(
  ProgramProgramResponse instance,
) => <String, dynamic>{
  'classes': ?instance.classes?.map((e) => e.toJson()).toList(),
  'created_at': ?instance.createdAt,
  'description': ?instance.description,
  'id': ?instance.id,
  'name': ?instance.name,
  'slug': ?instance.slug,
};
