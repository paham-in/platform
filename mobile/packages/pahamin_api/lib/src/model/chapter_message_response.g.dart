// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'chapter_message_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ChapterMessageResponse _$ChapterMessageResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('ChapterMessageResponse', json, ($checkedConvert) {
  final val = ChapterMessageResponse(
    message: $checkedConvert('message', (v) => v as String?),
  );
  return val;
});

Map<String, dynamic> _$ChapterMessageResponseToJson(
  ChapterMessageResponse instance,
) => <String, dynamic>{'message': ?instance.message};
