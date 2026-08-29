// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'class_error_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ClassErrorResponse _$ClassErrorResponseFromJson(Map<String, dynamic> json) =>
    $checkedCreate('ClassErrorResponse', json, ($checkedConvert) {
      final val = ClassErrorResponse(
        error: $checkedConvert('error', (v) => v as String?),
      );
      return val;
    });

Map<String, dynamic> _$ClassErrorResponseToJson(ClassErrorResponse instance) =>
    <String, dynamic>{'error': ?instance.error};
