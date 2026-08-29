// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'class_class_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ClassClassResponse _$ClassClassResponseFromJson(Map<String, dynamic> json) =>
    $checkedCreate(
      'ClassClassResponse',
      json,
      ($checkedConvert) {
        final val = ClassClassResponse(
          allowTutoring: $checkedConvert('allow_tutoring', (v) => v as bool?),
          contentPrice: $checkedConvert('content_price', (v) => v as num?),
          groupPrice: $checkedConvert('group_price', (v) => v as num?),
          id: $checkedConvert('id', (v) => (v as num?)?.toInt()),
          name: $checkedConvert('name', (v) => v as String?),
          pricePerSession: $checkedConvert(
            'price_per_session',
            (v) => v as num?,
          ),
          slug: $checkedConvert('slug', (v) => v as String?),
        );
        return val;
      },
      fieldKeyMap: const {
        'allowTutoring': 'allow_tutoring',
        'contentPrice': 'content_price',
        'groupPrice': 'group_price',
        'pricePerSession': 'price_per_session',
      },
    );

Map<String, dynamic> _$ClassClassResponseToJson(ClassClassResponse instance) =>
    <String, dynamic>{
      'allow_tutoring': ?instance.allowTutoring,
      'content_price': ?instance.contentPrice,
      'group_price': ?instance.groupPrice,
      'id': ?instance.id,
      'name': ?instance.name,
      'price_per_session': ?instance.pricePerSession,
      'slug': ?instance.slug,
    };
