// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'studentclass_class_ref.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

StudentclassClassRef _$StudentclassClassRefFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('StudentclassClassRef', json, ($checkedConvert) {
  final val = StudentclassClassRef(
    id: $checkedConvert('id', (v) => (v as num?)?.toInt()),
    name: $checkedConvert('name', (v) => v as String?),
    programName: $checkedConvert('program_name', (v) => v as String?),
  );
  return val;
}, fieldKeyMap: const {'programName': 'program_name'});

Map<String, dynamic> _$StudentclassClassRefToJson(
  StudentclassClassRef instance,
) => <String, dynamic>{
  'id': ?instance.id,
  'name': ?instance.name,
  'program_name': ?instance.programName,
};
