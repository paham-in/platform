// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'program_create_input.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ProgramCreateInput _$ProgramCreateInputFromJson(Map<String, dynamic> json) =>
    $checkedCreate('ProgramCreateInput', json, ($checkedConvert) {
      final val = ProgramCreateInput(
        description: $checkedConvert('description', (v) => v as String?),
        name: $checkedConvert('name', (v) => v as String?),
      );
      return val;
    });

Map<String, dynamic> _$ProgramCreateInputToJson(ProgramCreateInput instance) =>
    <String, dynamic>{
      'description': ?instance.description,
      'name': ?instance.name,
    };
