//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'invoice_message_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class InvoiceMessageResponse {
  /// Returns a new [InvoiceMessageResponse] instance.
  InvoiceMessageResponse({

     this.message,
  });

  @JsonKey(
    
    name: r'message',
    required: false,
    includeIfNull: false,
  )


  final String? message;





    @override
    bool operator ==(Object other) => identical(this, other) || other is InvoiceMessageResponse &&
      other.message == message;

    @override
    int get hashCode =>
        message.hashCode;

  factory InvoiceMessageResponse.fromJson(Map<String, dynamic> json) => _$InvoiceMessageResponseFromJson(json);

  Map<String, dynamic> toJson() => _$InvoiceMessageResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

