// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'push_error_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

PushErrorResponse _$PushErrorResponseFromJson(Map<String, dynamic> json) =>
    $checkedCreate('PushErrorResponse', json, ($checkedConvert) {
      final val = PushErrorResponse(
        error: $checkedConvert('error', (v) => v as String?),
      );
      return val;
    });

Map<String, dynamic> _$PushErrorResponseToJson(PushErrorResponse instance) =>
    <String, dynamic>{'error': ?instance.error};
