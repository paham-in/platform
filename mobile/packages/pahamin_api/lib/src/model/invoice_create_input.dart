//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'invoice_create_input.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class InvoiceCreateInput {
  /// Returns a new [InvoiceCreateInput] instance.
  InvoiceCreateInput({

     this.amount,

     this.classId,

     this.endDate,

     this.note,

     this.startDate,

     this.userId,
  });

  @JsonKey(
    
    name: r'amount',
    required: false,
    includeIfNull: false,
  )


  final num? amount;



  @JsonKey(
    
    name: r'class_id',
    required: false,
    includeIfNull: false,
  )


  final int? classId;



  @JsonKey(
    
    name: r'end_date',
    required: false,
    includeIfNull: false,
  )


  final String? endDate;



  @JsonKey(
    
    name: r'note',
    required: false,
    includeIfNull: false,
  )


  final String? note;



  @JsonKey(
    
    name: r'start_date',
    required: false,
    includeIfNull: false,
  )


  final String? startDate;



  @JsonKey(
    
    name: r'user_id',
    required: false,
    includeIfNull: false,
  )


  final int? userId;





    @override
    bool operator ==(Object other) => identical(this, other) || other is InvoiceCreateInput &&
      other.amount == amount &&
      other.classId == classId &&
      other.endDate == endDate &&
      other.note == note &&
      other.startDate == startDate &&
      other.userId == userId;

    @override
    int get hashCode =>
        amount.hashCode +
        classId.hashCode +
        endDate.hashCode +
        note.hashCode +
        startDate.hashCode +
        userId.hashCode;

  factory InvoiceCreateInput.fromJson(Map<String, dynamic> json) => _$InvoiceCreateInputFromJson(json);

  Map<String, dynamic> toJson() => _$InvoiceCreateInputToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

