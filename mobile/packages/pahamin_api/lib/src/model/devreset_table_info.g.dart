// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'devreset_table_info.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

DevresetTableInfo _$DevresetTableInfoFromJson(Map<String, dynamic> json) =>
    $checkedCreate('DevresetTableInfo', json, ($checkedConvert) {
      final val = DevresetTableInfo(
        description: $checkedConvert('description', (v) => v as String?),
        label: $checkedConvert('label', (v) => v as String?),
        name: $checkedConvert('name', (v) => v as String?),
        protected: $checkedConvert('protected', (v) => v as bool?),
        rows: $checkedConvert('rows', (v) => (v as num?)?.toInt()),
      );
      return val;
    });

Map<String, dynamic> _$DevresetTableInfoToJson(DevresetTableInfo instance) =>
    <String, dynamic>{
      'description': ?instance.description,
      'label': ?instance.label,
      'name': ?instance.name,
      'protected': ?instance.protected,
      'rows': ?instance.rows,
    };
