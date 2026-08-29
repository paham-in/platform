// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'invoice_error_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

InvoiceErrorResponse _$InvoiceErrorResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('InvoiceErrorResponse', json, ($checkedConvert) {
  final val = InvoiceErrorResponse(
    error: $checkedConvert('error', (v) => v as String?),
  );
  return val;
});

Map<String, dynamic> _$InvoiceErrorResponseToJson(
  InvoiceErrorResponse instance,
) => <String, dynamic>{'error': ?instance.error};
