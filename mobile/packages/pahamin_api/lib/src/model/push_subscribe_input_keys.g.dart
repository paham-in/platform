// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'push_subscribe_input_keys.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

PushSubscribeInputKeys _$PushSubscribeInputKeysFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('PushSubscribeInputKeys', json, ($checkedConvert) {
  final val = PushSubscribeInputKeys(
    auth: $checkedConvert('auth', (v) => v as String?),
    p256dh: $checkedConvert('p256dh', (v) => v as String?),
  );
  return val;
});

Map<String, dynamic> _$PushSubscribeInputKeysToJson(
  PushSubscribeInputKeys instance,
) => <String, dynamic>{'auth': ?instance.auth, 'p256dh': ?instance.p256dh};
