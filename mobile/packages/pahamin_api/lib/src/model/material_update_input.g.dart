// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'material_update_input.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

MaterialUpdateInput _$MaterialUpdateInputFromJson(Map<String, dynamic> json) =>
    $checkedCreate(
      'MaterialUpdateInput',
      json,
      ($checkedConvert) {
        final val = MaterialUpdateInput(
          chapterId: $checkedConvert('chapter_id', (v) => (v as num?)?.toInt()),
          content: $checkedConvert('content', (v) => v as String?),
          description: $checkedConvert('description', (v) => v as String?),
          isFree: $checkedConvert('is_free', (v) => v as bool?),
          order: $checkedConvert('order', (v) => (v as num?)?.toInt()),
          status: $checkedConvert('status', (v) => v as String?),
          title: $checkedConvert('title', (v) => v as String?),
          type: $checkedConvert('type', (v) => v as String?),
          videoUrl: $checkedConvert('video_url', (v) => v as String?),
        );
        return val;
      },
      fieldKeyMap: const {
        'chapterId': 'chapter_id',
        'isFree': 'is_free',
        'videoUrl': 'video_url',
      },
    );

Map<String, dynamic> _$MaterialUpdateInputToJson(
  MaterialUpdateInput instance,
) => <String, dynamic>{
  'chapter_id': ?instance.chapterId,
  'content': ?instance.content,
  'description': ?instance.description,
  'is_free': ?instance.isFree,
  'order': ?instance.order,
  'status': ?instance.status,
  'title': ?instance.title,
  'type': ?instance.type,
  'video_url': ?instance.videoUrl,
};
