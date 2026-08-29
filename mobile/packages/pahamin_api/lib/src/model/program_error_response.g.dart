// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'program_error_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ProgramErrorResponse _$ProgramErrorResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('ProgramErrorResponse', json, ($checkedConvert) {
  final val = ProgramErrorResponse(
    error: $checkedConvert('error', (v) => v as String?),
  );
  return val;
});

Map<String, dynamic> _$ProgramErrorResponseToJson(
  ProgramErrorResponse instance,
) => <String, dynamic>{'error': ?instance.error};
