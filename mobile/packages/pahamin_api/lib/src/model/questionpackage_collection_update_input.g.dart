// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'questionpackage_collection_update_input.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

QuestionpackageCollectionUpdateInput
_$QuestionpackageCollectionUpdateInputFromJson(Map<String, dynamic> json) =>
    $checkedCreate('QuestionpackageCollectionUpdateInput', json, (
      $checkedConvert,
    ) {
      final val = QuestionpackageCollectionUpdateInput(
        classId: $checkedConvert('class_id', (v) => (v as num?)?.toInt()),
        description: $checkedConvert('description', (v) => v as String?),
        isFree: $checkedConvert('is_free', (v) => v as bool?),
        name: $checkedConvert('name', (v) => v as String?),
      );
      return val;
    }, fieldKeyMap: const {'classId': 'class_id', 'isFree': 'is_free'});

Map<String, dynamic> _$QuestionpackageCollectionUpdateInputToJson(
  QuestionpackageCollectionUpdateInput instance,
) => <String, dynamic>{
  'class_id': ?instance.classId,
  'description': ?instance.description,
  'is_free': ?instance.isFree,
  'name': ?instance.name,
};
