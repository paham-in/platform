//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'questionbank_error_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class QuestionbankErrorResponse {
  /// Returns a new [QuestionbankErrorResponse] instance.
  QuestionbankErrorResponse({

     this.error,
  });

  @JsonKey(
    
    name: r'error',
    required: false,
    includeIfNull: false,
  )


  final String? error;





    @override
    bool operator ==(Object other) => identical(this, other) || other is QuestionbankErrorResponse &&
      other.error == error;

    @override
    int get hashCode =>
        error.hashCode;

  factory QuestionbankErrorResponse.fromJson(Map<String, dynamic> json) => _$QuestionbankErrorResponseFromJson(json);

  Map<String, dynamic> toJson() => _$QuestionbankErrorResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

