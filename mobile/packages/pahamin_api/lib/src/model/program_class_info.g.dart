// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'program_class_info.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ProgramClassInfo _$ProgramClassInfoFromJson(Map<String, dynamic> json) =>
    $checkedCreate('ProgramClassInfo', json, ($checkedConvert) {
      final val = ProgramClassInfo(
        id: $checkedConvert('id', (v) => (v as num?)?.toInt()),
        name: $checkedConvert('name', (v) => v as String?),
      );
      return val;
    });

Map<String, dynamic> _$ProgramClassInfoToJson(ProgramClassInfo instance) =>
    <String, dynamic>{'id': ?instance.id, 'name': ?instance.name};
