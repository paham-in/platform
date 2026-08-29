// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'forum_message_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ForumMessageResponse _$ForumMessageResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('ForumMessageResponse', json, ($checkedConvert) {
  final val = ForumMessageResponse(
    message: $checkedConvert('message', (v) => v as String?),
  );
  return val;
});

Map<String, dynamic> _$ForumMessageResponseToJson(
  ForumMessageResponse instance,
) => <String, dynamic>{'message': ?instance.message};
