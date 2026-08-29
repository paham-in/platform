// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'forum_answer_preview.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ForumAnswerPreview _$ForumAnswerPreviewFromJson(Map<String, dynamic> json) =>
    $checkedCreate(
      'ForumAnswerPreview',
      json,
      ($checkedConvert) {
        final val = ForumAnswerPreview(
          createdAt: $checkedConvert('created_at', (v) => v as String?),
          plainContent: $checkedConvert('plain_content', (v) => v as String?),
          userAvatar: $checkedConvert('user_avatar', (v) => v as String?),
          userName: $checkedConvert('user_name', (v) => v as String?),
        );
        return val;
      },
      fieldKeyMap: const {
        'createdAt': 'created_at',
        'plainContent': 'plain_content',
        'userAvatar': 'user_avatar',
        'userName': 'user_name',
      },
    );

Map<String, dynamic> _$ForumAnswerPreviewToJson(ForumAnswerPreview instance) =>
    <String, dynamic>{
      'created_at': ?instance.createdAt,
      'plain_content': ?instance.plainContent,
      'user_avatar': ?instance.userAvatar,
      'user_name': ?instance.userName,
    };
