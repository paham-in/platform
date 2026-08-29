//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'invoice_error_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class InvoiceErrorResponse {
  /// Returns a new [InvoiceErrorResponse] instance.
  InvoiceErrorResponse({

     this.error,
  });

  @JsonKey(
    
    name: r'error',
    required: false,
    includeIfNull: false,
  )


  final String? error;





    @override
    bool operator ==(Object other) => identical(this, other) || other is InvoiceErrorResponse &&
      other.error == error;

    @override
    int get hashCode =>
        error.hashCode;

  factory InvoiceErrorResponse.fromJson(Map<String, dynamic> json) => _$InvoiceErrorResponseFromJson(json);

  Map<String, dynamic> toJson() => _$InvoiceErrorResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

