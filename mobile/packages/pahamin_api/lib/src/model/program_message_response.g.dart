// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'program_message_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ProgramMessageResponse _$ProgramMessageResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('ProgramMessageResponse', json, ($checkedConvert) {
  final val = ProgramMessageResponse(
    message: $checkedConvert('message', (v) => v as String?),
  );
  return val;
});

Map<String, dynamic> _$ProgramMessageResponseToJson(
  ProgramMessageResponse instance,
) => <String, dynamic>{'message': ?instance.message};
