// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'forum_error_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ForumErrorResponse _$ForumErrorResponseFromJson(Map<String, dynamic> json) =>
    $checkedCreate('ForumErrorResponse', json, ($checkedConvert) {
      final val = ForumErrorResponse(
        error: $checkedConvert('error', (v) => v as String?),
      );
      return val;
    });

Map<String, dynamic> _$ForumErrorResponseToJson(ForumErrorResponse instance) =>
    <String, dynamic>{'error': ?instance.error};
