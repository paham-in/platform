// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'invoice_create_input.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

InvoiceCreateInput _$InvoiceCreateInputFromJson(Map<String, dynamic> json) =>
    $checkedCreate(
      'InvoiceCreateInput',
      json,
      ($checkedConvert) {
        final val = InvoiceCreateInput(
          amount: $checkedConvert('amount', (v) => v as num?),
          classId: $checkedConvert('class_id', (v) => (v as num?)?.toInt()),
          endDate: $checkedConvert('end_date', (v) => v as String?),
          note: $checkedConvert('note', (v) => v as String?),
          startDate: $checkedConvert('start_date', (v) => v as String?),
          userId: $checkedConvert('user_id', (v) => (v as num?)?.toInt()),
        );
        return val;
      },
      fieldKeyMap: const {
        'classId': 'class_id',
        'endDate': 'end_date',
        'startDate': 'start_date',
        'userId': 'user_id',
      },
    );

Map<String, dynamic> _$InvoiceCreateInputToJson(InvoiceCreateInput instance) =>
    <String, dynamic>{
      'amount': ?instance.amount,
      'class_id': ?instance.classId,
      'end_date': ?instance.endDate,
      'note': ?instance.note,
      'start_date': ?instance.startDate,
      'user_id': ?instance.userId,
    };
