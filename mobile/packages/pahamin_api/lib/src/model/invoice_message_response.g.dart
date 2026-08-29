// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'invoice_message_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

InvoiceMessageResponse _$InvoiceMessageResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('InvoiceMessageResponse', json, ($checkedConvert) {
  final val = InvoiceMessageResponse(
    message: $checkedConvert('message', (v) => v as String?),
  );
  return val;
});

Map<String, dynamic> _$InvoiceMessageResponseToJson(
  InvoiceMessageResponse instance,
) => <String, dynamic>{'message': ?instance.message};
