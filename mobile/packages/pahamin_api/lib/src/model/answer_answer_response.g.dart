// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'answer_answer_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

AnswerAnswerResponse _$AnswerAnswerResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate(
  'AnswerAnswerResponse',
  json,
  ($checkedConvert) {
    final val = AnswerAnswerResponse(
      content: $checkedConvert('content', (v) => v as String?),
      createdAt: $checkedConvert('created_at', (v) => v as String?),
      id: $checkedConvert('id', (v) => (v as num?)?.toInt()),
      isOwner: $checkedConvert('is_owner', (v) => v as bool?),
      plainContent: $checkedConvert('plain_content', (v) => v as String?),
      publicId: $checkedConvert('public_id', (v) => v as String?),
      userAvatar: $checkedConvert('user_avatar', (v) => v as String?),
      userName: $checkedConvert('user_name', (v) => v as String?),
      videoUrl: $checkedConvert('video_url', (v) => v as String?),
    );
    return val;
  },
  fieldKeyMap: const {
    'createdAt': 'created_at',
    'isOwner': 'is_owner',
    'plainContent': 'plain_content',
    'publicId': 'public_id',
    'userAvatar': 'user_avatar',
    'userName': 'user_name',
    'videoUrl': 'video_url',
  },
);

Map<String, dynamic> _$AnswerAnswerResponseToJson(
  AnswerAnswerResponse instance,
) => <String, dynamic>{
  'content': ?instance.content,
  'created_at': ?instance.createdAt,
  'id': ?instance.id,
  'is_owner': ?instance.isOwner,
  'plain_content': ?instance.plainContent,
  'public_id': ?instance.publicId,
  'user_avatar': ?instance.userAvatar,
  'user_name': ?instance.userName,
  'video_url': ?instance.videoUrl,
};
