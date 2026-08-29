//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'studentclass_error_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class StudentclassErrorResponse {
  /// Returns a new [StudentclassErrorResponse] instance.
  StudentclassErrorResponse({

     this.error,
  });

  @JsonKey(
    
    name: r'error',
    required: false,
    includeIfNull: false,
  )


  final String? error;





    @override
    bool operator ==(Object other) => identical(this, other) || other is StudentclassErrorResponse &&
      other.error == error;

    @override
    int get hashCode =>
        error.hashCode;

  factory StudentclassErrorResponse.fromJson(Map<String, dynamic> json) => _$StudentclassErrorResponseFromJson(json);

  Map<String, dynamic> toJson() => _$StudentclassErrorResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

