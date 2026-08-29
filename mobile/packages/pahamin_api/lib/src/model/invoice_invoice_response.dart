//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'invoice_invoice_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class InvoiceInvoiceResponse {
  /// Returns a new [InvoiceInvoiceResponse] instance.
  InvoiceInvoiceResponse({

     this.amount,

     this.createdAt,

     this.endDate,

     this.id,

     this.note,

     this.startDate,

     this.status,

     this.userId,

     this.userName,
  });

  @JsonKey(
    
    name: r'amount',
    required: false,
    includeIfNull: false,
  )


  final num? amount;



  @JsonKey(
    
    name: r'created_at',
    required: false,
    includeIfNull: false,
  )


  final String? createdAt;



  @JsonKey(
    
    name: r'end_date',
    required: false,
    includeIfNull: false,
  )


  final String? endDate;



  @JsonKey(
    
    name: r'id',
    required: false,
    includeIfNull: false,
  )


  final int? id;



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
    
    name: r'status',
    required: false,
    includeIfNull: false,
  )


  final String? status;



  @JsonKey(
    
    name: r'user_id',
    required: false,
    includeIfNull: false,
  )


  final int? userId;



  @JsonKey(
    
    name: r'user_name',
    required: false,
    includeIfNull: false,
  )


  final String? userName;





    @override
    bool operator ==(Object other) => identical(this, other) || other is InvoiceInvoiceResponse &&
      other.amount == amount &&
      other.createdAt == createdAt &&
      other.endDate == endDate &&
      other.id == id &&
      other.note == note &&
      other.startDate == startDate &&
      other.status == status &&
      other.userId == userId &&
      other.userName == userName;

    @override
    int get hashCode =>
        amount.hashCode +
        createdAt.hashCode +
        endDate.hashCode +
        id.hashCode +
        note.hashCode +
        startDate.hashCode +
        status.hashCode +
        userId.hashCode +
        userName.hashCode;

  factory InvoiceInvoiceResponse.fromJson(Map<String, dynamic> json) => _$InvoiceInvoiceResponseFromJson(json);

  Map<String, dynamic> toJson() => _$InvoiceInvoiceResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

