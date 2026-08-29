// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'program_update_input.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ProgramUpdateInput _$ProgramUpdateInputFromJson(Map<String, dynamic> json) =>
    $checkedCreate('ProgramUpdateInput', json, ($checkedConvert) {
      final val = ProgramUpdateInput(
        description: $checkedConvert('description', (v) => v as String?),
        name: $checkedConvert('name', (v) => v as String?),
      );
      return val;
    });

Map<String, dynamic> _$ProgramUpdateInputToJson(ProgramUpdateInput instance) =>
    <String, dynamic>{
      'description': ?instance.description,
      'name': ?instance.name,
    };
