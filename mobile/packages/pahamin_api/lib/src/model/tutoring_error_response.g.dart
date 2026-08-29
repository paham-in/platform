// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tutoring_error_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

TutoringErrorResponse _$TutoringErrorResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('TutoringErrorResponse', json, ($checkedConvert) {
  final val = TutoringErrorResponse(
    error: $checkedConvert('error', (v) => v as String?),
  );
  return val;
});

Map<String, dynamic> _$TutoringErrorResponseToJson(
  TutoringErrorResponse instance,
) => <String, dynamic>{'error': ?instance.error};
