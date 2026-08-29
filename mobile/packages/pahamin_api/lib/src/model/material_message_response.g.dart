// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'material_message_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

MaterialMessageResponse _$MaterialMessageResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('MaterialMessageResponse', json, ($checkedConvert) {
  final val = MaterialMessageResponse(
    message: $checkedConvert('message', (v) => v as String?),
  );
  return val;
});

Map<String, dynamic> _$MaterialMessageResponseToJson(
  MaterialMessageResponse instance,
) => <String, dynamic>{'message': ?instance.message};
