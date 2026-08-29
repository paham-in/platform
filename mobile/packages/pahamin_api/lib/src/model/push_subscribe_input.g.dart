// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'push_subscribe_input.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

PushSubscribeInput _$PushSubscribeInputFromJson(Map<String, dynamic> json) =>
    $checkedCreate('PushSubscribeInput', json, ($checkedConvert) {
      final val = PushSubscribeInput(
        endpoint: $checkedConvert('endpoint', (v) => v as String?),
        keys: $checkedConvert(
          'keys',
          (v) => v == null
              ? null
              : PushSubscribeInputKeys.fromJson(v as Map<String, dynamic>),
        ),
      );
      return val;
    });

Map<String, dynamic> _$PushSubscribeInputToJson(PushSubscribeInput instance) =>
    <String, dynamic>{
      'endpoint': ?instance.endpoint,
      'keys': ?instance.keys?.toJson(),
    };
