//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'answer_error_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class AnswerErrorResponse {
  /// Returns a new [AnswerErrorResponse] instance.
  AnswerErrorResponse({

     this.error,
  });

  @JsonKey(
    
    name: r'error',
    required: false,
    includeIfNull: false,
  )


  final String? error;





    @override
    bool operator ==(Object other) => identical(this, other) || other is AnswerErrorResponse &&
      other.error == error;

    @override
    int get hashCode =>
        error.hashCode;

  factory AnswerErrorResponse.fromJson(Map<String, dynamic> json) => _$AnswerErrorResponseFromJson(json);

  Map<String, dynamic> toJson() => _$AnswerErrorResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

