// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'devreset_list_tables_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

DevresetListTablesResponse _$DevresetListTablesResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('DevresetListTablesResponse', json, ($checkedConvert) {
  final val = DevresetListTablesResponse(
    enabled: $checkedConvert('enabled', (v) => v as bool?),
    tables: $checkedConvert(
      'tables',
      (v) => (v as List<dynamic>?)
          ?.map((e) => DevresetTableInfo.fromJson(e as Map<String, dynamic>))
          .toList(),
    ),
  );
  return val;
});

Map<String, dynamic> _$DevresetListTablesResponseToJson(
  DevresetListTablesResponse instance,
) => <String, dynamic>{
  'enabled': ?instance.enabled,
  'tables': ?instance.tables?.map((e) => e.toJson()).toList(),
};
