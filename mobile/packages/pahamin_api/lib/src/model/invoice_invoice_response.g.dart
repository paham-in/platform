// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'invoice_invoice_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

InvoiceInvoiceResponse _$InvoiceInvoiceResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate(
  'InvoiceInvoiceResponse',
  json,
  ($checkedConvert) {
    final val = InvoiceInvoiceResponse(
      amount: $checkedConvert('amount', (v) => v as num?),
      createdAt: $checkedConvert('created_at', (v) => v as String?),
      endDate: $checkedConvert('end_date', (v) => v as String?),
      id: $checkedConvert('id', (v) => (v as num?)?.toInt()),
      note: $checkedConvert('note', (v) => v as String?),
      startDate: $checkedConvert('start_date', (v) => v as String?),
      status: $checkedConvert('status', (v) => v as String?),
      userId: $checkedConvert('user_id', (v) => (v as num?)?.toInt()),
      userName: $checkedConvert('user_name', (v) => v as String?),
    );
    return val;
  },
  fieldKeyMap: const {
    'createdAt': 'created_at',
    'endDate': 'end_date',
    'startDate': 'start_date',
    'userId': 'user_id',
    'userName': 'user_name',
  },
);

Map<String, dynamic> _$InvoiceInvoiceResponseToJson(
  InvoiceInvoiceResponse instance,
) => <String, dynamic>{
  'amount': ?instance.amount,
  'created_at': ?instance.createdAt,
  'end_date': ?instance.endDate,
  'id': ?instance.id,
  'note': ?instance.note,
  'start_date': ?instance.startDate,
  'status': ?instance.status,
  'user_id': ?instance.userId,
  'user_name': ?instance.userName,
};
