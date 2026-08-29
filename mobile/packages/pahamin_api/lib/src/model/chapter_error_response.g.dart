// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'chapter_error_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ChapterErrorResponse _$ChapterErrorResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('ChapterErrorResponse', json, ($checkedConvert) {
  final val = ChapterErrorResponse(
    error: $checkedConvert('error', (v) => v as String?),
  );
  return val;
});

Map<String, dynamic> _$ChapterErrorResponseToJson(
  ChapterErrorResponse instance,
) => <String, dynamic>{'error': ?instance.error};
