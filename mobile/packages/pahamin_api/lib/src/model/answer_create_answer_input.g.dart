// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'answer_create_answer_input.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

AnswerCreateAnswerInput _$AnswerCreateAnswerInputFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('AnswerCreateAnswerInput', json, ($checkedConvert) {
  final val = AnswerCreateAnswerInput(
    content: $checkedConvert('content', (v) => v as String?),
    videoUrl: $checkedConvert('video_url', (v) => v as String?),
  );
  return val;
}, fieldKeyMap: const {'videoUrl': 'video_url'});

Map<String, dynamic> _$AnswerCreateAnswerInputToJson(
  AnswerCreateAnswerInput instance,
) => <String, dynamic>{
  'content': ?instance.content,
  'video_url': ?instance.videoUrl,
};
